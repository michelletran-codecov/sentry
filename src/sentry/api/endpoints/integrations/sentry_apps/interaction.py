import logging

from rest_framework.request import Request
from rest_framework.response import Response

from sentry import tsdb
from sentry.api.api_owners import ApiOwner
from sentry.api.api_publish_status import ApiPublishStatus
from sentry.api.base import StatsMixin, region_silo_endpoint
from sentry.api.bases import RegionSentryAppBaseEndpoint, SentryAppStatsPermission
from sentry.api.bases.sentryapps import COMPONENT_TYPES
from sentry.services.hybrid_cloud.app import app_service
from sentry.tsdb.base import TSDBModel

logger = logging.getLogger(__name__)

TSDB_MODELS = [TSDBModel.sentry_app_viewed, TSDBModel.sentry_app_component_interacted]


def get_component_interaction_key(sentry_app, component_type):
    return f"{sentry_app.slug}:{component_type}"


@region_silo_endpoint
class SentryAppInteractionEndpoint(RegionSentryAppBaseEndpoint, StatsMixin):
    owner = ApiOwner.INTEGRATIONS
    publish_status = {
        "GET": ApiPublishStatus.UNKNOWN,
        "POST": ApiPublishStatus.UNKNOWN,
    }
    permission_classes = (SentryAppStatsPermission,)

    def get(self, request: Request, sentry_app) -> Response:
        """
        :qparam float since
        :qparam float until
        :qparam resolution - optional
        """

        views = tsdb.backend.get_range(
            model=TSDBModel.sentry_app_viewed,
            keys=[sentry_app.id],
            **self._parse_args(request),
            tenant_ids={"organization_id": sentry_app.owner_id},
        )[sentry_app.id]

        components = app_service.find_app_components(app_id=sentry_app.id)

        component_interactions = tsdb.backend.get_range(
            model=TSDBModel.sentry_app_component_interacted,
            keys=[
                get_component_interaction_key(sentry_app, component.type)
                for component in components
            ],
            **self._parse_args(request),
            tenant_ids={"organization_id": sentry_app.owner_id},
        )

        return Response(
            {
                "views": views,
                "componentInteractions": {
                    k.split(":")[1]: v for k, v in component_interactions.items()
                },
            }
        )

    def post(self, request: Request, sentry_app) -> Response:
        """
        Increment a TSDB metric relating to Sentry App interactions

        :param string tsdbField         the name of the TSDB model to increment
        :param string componentType     required for 'sentry_app_component_interacted' metric
        """
        # Request should have identifier field stored in TSDBModel
        tsdb_field = request.data.get("tsdbField", "")
        key = None

        model = getattr(TSDBModel, tsdb_field, None)
        if model is None or model not in TSDB_MODELS:
            return Response(
                {
                    "detail": "The tsdbField must be one of: sentry_app_viewed, sentry_app_component_interacted"
                },
                status=400,
            )

        if model == TSDBModel.sentry_app_component_interacted:
            component_type = request.data.get("componentType", None)
            if component_type is None or component_type not in COMPONENT_TYPES:
                return Response(
                    {
                        "detail": f"The field componentType is required and must be one of {COMPONENT_TYPES}"
                    },
                    status=400,
                )

            key = get_component_interaction_key(sentry_app, request.data["componentType"])
        elif model == TSDBModel.sentry_app_viewed:
            key = sentry_app.id

        # Timestamp is automatically created
        tsdb.backend.incr(model, key)

        return Response({}, status=201)
